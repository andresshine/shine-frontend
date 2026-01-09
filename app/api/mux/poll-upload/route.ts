/**
 * API Route: Poll Mux Upload Status
 * POST /api/mux/poll-upload
 * Checks if upload has been processed and updates database
 */

import { NextRequest, NextResponse } from "next/server";
import { getUpload, getAsset } from "@/lib/mux/client";
import { createClient } from "@supabase/supabase-js";
import { transcribeFromUrl } from "@/lib/deepgram/client";
import { waitUntil } from "@vercel/functions";

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

        // Trigger transcription in background using waitUntil (doesn't block response)
        if (playbackId) {
          console.log("🎬 Triggering transcription in background...");
          const transcriptionPromise = triggerTranscription(recordingId, playbackId)
            .catch(err => console.error("❌ Background transcription failed:", err));

          // waitUntil keeps the function alive after response is sent
          waitUntil(transcriptionPromise);
        }

        // Return immediately - transcription continues in background
        return NextResponse.json({
          status: "ready",
          assetId: asset.id,
          playbackId,
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

/**
 * Wait for a URL to become available (returns 200 OK)
 */
async function waitForUrl(url: string, maxAttempts: number = 15, interval: number = 1000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ URL available after ${attempt} attempt(s):`, url);
        return true;
      }
      console.log(`⏳ Waiting for static file generation... (attempt ${attempt}/${maxAttempts}, status: ${response.status})`);
    } catch (e) {
      console.log(`⏳ Waiting for static file generation... (attempt ${attempt}/${maxAttempts}, fetch error)`);
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  return false;
}

async function triggerTranscription(recordingId: string, playbackId: string) {
  // Define URLs - audio.m4a is smaller/faster for transcription
  const primaryUrl = `https://stream.mux.com/${playbackId}/audio.m4a`;
  const fallbackUrl = `https://stream.mux.com/${playbackId}/low.mp4`;

  console.log("📝 Starting transcription for recording:", recordingId);
  console.log("🔍 Checking for static file availability...");

  // Wait for primary URL (audio.m4a)
  let urlToUse: string | null = null;

  if (await waitForUrl(primaryUrl, 30, 1000)) {  // 30 attempts, 1s apart = 30s max
    urlToUse = primaryUrl;
  } else {
    console.log("⚠️ audio.m4a not available after retries, trying low.mp4...");
    if (await waitForUrl(fallbackUrl, 15, 1000)) {  // 15 attempts, 1s apart = 15s max
      urlToUse = fallbackUrl;
    }
  }

  if (!urlToUse) {
    throw new Error("Static files (audio.m4a and low.mp4) not available after maximum retries");
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

    // Re-throw so caller knows it failed
    throw error;
  }
}
