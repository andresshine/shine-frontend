/**
 * Test Script: Shotstack Render with Captions
 * Tests the full automation pipeline including SRT generation
 *
 * Run with: npx tsx scripts/test-shotstack-render.ts
 */

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
config({ path: ".env.local" });

const RECORDING_ID = "b8184b42-e864-4277-bea8-4b030bcac23a";

async function main() {
  console.log("=".repeat(60));
  console.log("🧪 SHOTSTACK RENDER TEST WITH CAPTIONS");
  console.log("=".repeat(60));
  console.log(`\n📌 Recording ID: ${RECORDING_ID}\n`);

  // Dynamic imports after env vars are loaded
  const { createClient } = await import("@supabase/supabase-js");
  const { processReadyVideo } = await import("../lib/services/automation");

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ========== STEP 1: Fetch and verify recording data ==========
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
  console.log(`   - Transcription: "${recording.transcription?.substring(0, 50)}..."`);

  // Check transcription_data
  if (recording.transcription_data) {
    const wordCount = recording.transcription_data?.results?.channels?.[0]?.alternatives?.[0]?.words?.length || 0;
    console.log(`   - transcription_data: ✅ PRESENT (${wordCount} words with timings)`);
  } else {
    console.log(`   - transcription_data: ❌ MISSING`);
    console.log("\n⚠️  Cannot proceed without transcription_data for SRT generation.");
    process.exit(1);
  }

  // ========== STEP 2: Trigger Shotstack production ==========
  console.log("\n" + "=".repeat(60));
  console.log("2️⃣  TRIGGERING SHOTSTACK PRODUCTION...\n");

  try {
    const result = await processReadyVideo(RECORDING_ID);

    console.log("\n" + "=".repeat(60));
    console.log("3️⃣  RESULT\n");

    if (result.success) {
      console.log("   ✅ Shotstack render job submitted successfully!");
      console.log(`   - Render ID: ${result.renderId}`);
      console.log(`\n   📺 Check render status at:`);
      console.log(`   https://dashboard.shotstack.io/renders/${result.renderId}`);
    } else {
      console.log("   ❌ Shotstack render failed!");
      console.log(`   - Error: ${result.error}`);
    }
  } catch (error) {
    console.error("\n❌ Exception during production:", error);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 TEST COMPLETE");
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
