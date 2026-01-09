/**
 * Produce Video Script
 * Triggers Shotstack post-production with music and subtitles
 *
 * Run with: npx tsx scripts/produce-video.ts <recording_id>
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const RECORDING_ID = process.argv[2] || "ec55d6bf-e056-4eb1-9c1b-4f20d2fa483b";

async function main() {
  console.log("=".repeat(60));
  console.log("🎬 SHOTSTACK VIDEO PRODUCTION");
  console.log("=".repeat(60));
  console.log(`\n📌 Recording ID: ${RECORDING_ID}\n`);

  const { createClient } = await import("@supabase/supabase-js");
  const { processReadyVideo } = await import("../lib/services/automation");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch recording to verify it exists
  console.log("1️⃣  FETCHING RECORDING DATA...\n");

  const { data: recording, error: fetchError } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", RECORDING_ID)
    .single();

  if (fetchError || !recording) {
    console.error("❌ Failed to fetch recording:", fetchError);
    process.exit(1);
  }

  console.log("   ✅ Recording found!");
  console.log(`   - Session ID: ${recording.session_id}`);
  console.log(`   - Question Index: ${recording.question_index}`);
  console.log(`   - Video Status: ${recording.video_status}`);
  console.log(`   - Transcription Status: ${recording.transcription_status}`);
  console.log(`   - Mux Playback ID: ${recording.mux_playback_id}`);
  console.log(`   - Duration: ${recording.duration_seconds}s`);

  if (recording.transcription) {
    console.log(`   - Transcription: "${recording.transcription?.substring(0, 80)}..."`);
  }

  if (recording.transcription_data) {
    const wordCount = recording.transcription_data?.results?.channels?.[0]?.alternatives?.[0]?.words?.length || 0;
    console.log(`   - Transcription Data: ✅ (${wordCount} words with timings for subtitles)`);
  } else {
    console.log(`   - Transcription Data: ❌ (no word timings - subtitles may not work)`);
  }

  // Trigger production
  console.log("\n" + "=".repeat(60));
  console.log("2️⃣  TRIGGERING SHOTSTACK PRODUCTION...");
  console.log("   - Background music: ✅");
  console.log("   - Auto-generated subtitles: " + (recording.transcription_data ? "✅" : "❌"));
  console.log("");

  try {
    const result = await processReadyVideo(RECORDING_ID);

    console.log("\n" + "=".repeat(60));
    console.log("3️⃣  RESULT\n");

    if (result.success) {
      console.log("   ✅ Shotstack render job submitted!");
      console.log(`   - Render ID: ${result.renderId}`);
      console.log(`\n   📺 Check render status at:`);
      console.log(`   https://dashboard.shotstack.io/renders/${result.renderId}`);
      console.log(`\n   ⏱️  Rendering typically takes 1-3 minutes.`);
      console.log(`   Once complete, the video will be automatically uploaded to Mux.`);
    } else {
      console.log("   ❌ Shotstack render failed!");
      console.log(`   - Error: ${result.error}`);
    }
  } catch (error) {
    console.error("\n❌ Exception during production:", error);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 COMPLETE");
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
