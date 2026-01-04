/**
 * API Route: Poll Mux Upload Status
 * POST /api/mux/poll-upload
 * Checks if upload has been processed and updates database
 */

import { NextRequest, NextResponse } from "next/server";
import { mux } from "@/lib/mux/client";
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
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (upload.asset_id) {
      // Asset has been created!
      const asset = await mux.video.assets.retrieve(upload.asset_id);

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

        // Trigger transcription after a delay (audio extraction takes time)
        if (playbackId) {
          // Wait 30 seconds for Mux to finish audio extraction
          setTimeout(async () => {
            await triggerTranscription(recordingId, playbackId);
          }, 30000);
        }

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

async function triggerTranscription(recordingId: string, playbackId: string) {
  try {
    console.log(`Starting transcription for recording ${recordingId}`);

    await supabase
      .from("recordings")
      .update({ transcript_status: "processing" })
      .eq("id", recordingId);

    // Use Mux static rendition URL (MP4 file)
    const videoUrl = `https://stream.mux.com/${playbackId}/low.mp4`;
    console.log(`Transcribing from URL: ${videoUrl}`);

    // Transcribe directly from URL (Deepgram will fetch the file)
    const { transcript } = await transcribeFromUrl(videoUrl);

    await supabase
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
    await supabase
      .from("recordings")
      .update({ transcript_status: "failed" })
      .eq("id", recordingId);
  }
}
