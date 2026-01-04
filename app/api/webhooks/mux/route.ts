/**
 * API Route: Mux Webhooks
 * POST /api/webhooks/mux
 * Handles Mux webhook events for video processing status
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

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

  // Update recording in database
  // @ts-ignore - Supabase type inference issue with update
  const { data: recording, error } = await supabase
    .from("recordings")
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
  try {
    // Import transcription function
    const { transcribeFromUrl } = await import("@/lib/deepgram/client");
    const { createClient } = await import("@supabase/supabase-js");

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update status to processing
    await supabaseService
      .from("recordings")
      .update({ transcript_status: "processing" })
      .eq("id", recordingId);

    // Get audio from Mux
    const audioUrl = `https://stream.mux.com/${playbackId}/audio.m4a`;

    // Transcribe
    const { transcript } = await transcribeFromUrl(audioUrl);

    // Save transcript
    await supabaseService
      .from("recordings")
      .update({
        transcript,
        transcript_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordingId);

    console.log("Transcription completed for recording:", recordingId);
  } catch (error) {
    console.error("Transcription failed:", error);

    // Update status to failed
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseService
      .from("recordings")
      .update({ transcript_status: "failed" })
      .eq("id", recordingId);
  }
}

/**
 * Handle asset error event
 */
async function handleAssetError(data: any) {
  const assetId = data.id;

  console.log("Asset errored:", assetId);

  // Update recording in database
  const { error } = await supabase
    .from("recordings")
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
