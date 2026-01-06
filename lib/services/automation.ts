/**
 * Shine Post-Producer Automation Service
 * Triggers video post-production when recordings become ready
 */

import { createClient } from "@supabase/supabase-js";
import { produceTestimonial, ThemeConfig } from "./shotstack";

// ==================== CONFIGURATION ====================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Brand music URL for testimonial videos
const BRAND_MUSIC_URL = process.env.BRAND_MUSIC_URL || "https://cdn.example.com/shine-brand-music.mp3";

// Default theme if brand customization is not available
const DEFAULT_THEME: ThemeConfig = {
  primaryColor: "#FFFFFF",
  secondaryColor: "#E5E5E5",
  tertiaryColor: "#CCCCCC",
  fontFamily: "Montserrat",
  backgroundType: "color",
  backgroundColor: "#1a1a2e",
};

// ==================== TYPES ====================

interface RecordingData {
  id: string;
  session_id: string;
  question_id: string;
  question_index: number;
  mux_playback_id: string | null;
  transcription: string | null;
  video_status: string;
  transcription_status: string;
  duration_seconds: number | null;
}

interface SessionData {
  id: string;
  campaign_id: string;
  company_id: string;
}

interface CampaignData {
  id: string;
  name: string;
  questions: Array<{ id: string; text: string }>;
}

interface BrandCustomization {
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  font_family: string;
}

export interface ProcessResult {
  success: boolean;
  renderId?: string;
  error?: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract the first N words from a transcript
 * Formats them with proper capitalization and adds ellipsis if truncated
 */
export function extractFirstWords(transcript: string, wordCount: number = 6): string {
  if (!transcript || transcript.trim().length === 0) {
    return "";
  }

  // Clean the transcript and split into words
  const cleanedTranscript = transcript
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/^["'\s]+|["'\s]+$/g, ""); // Remove leading/trailing quotes

  const words = cleanedTranscript.split(" ");

  if (words.length <= wordCount) {
    // Return full transcript if it's short enough
    return `"${cleanedTranscript}"`;
  }

  // Take first N words and add ellipsis
  const firstWords = words.slice(0, wordCount).join(" ");
  return `"${firstWords}..."`;
}

/**
 * Get the fallback text (question text) for overlay when transcript is unavailable
 */
function getQuestionText(campaign: CampaignData, questionIndex: number): string {
  const questions = campaign.questions || [];
  const question = questions[questionIndex];
  return question?.text || campaign.name || "Testimonial";
}

/**
 * Build ThemeConfig from brand customization data
 */
function buildThemeConfig(brandCustomization: BrandCustomization | null): ThemeConfig {
  if (!brandCustomization) {
    return DEFAULT_THEME;
  }

  return {
    primaryColor: brandCustomization.primary_color || DEFAULT_THEME.primaryColor,
    secondaryColor: brandCustomization.secondary_color || DEFAULT_THEME.secondaryColor,
    tertiaryColor: brandCustomization.tertiary_color || DEFAULT_THEME.tertiaryColor,
    fontFamily: brandCustomization.font_family || "Montserrat",
    backgroundType: "color",
    backgroundColor: "#1a1a2e",
  };
}

// ==================== MAIN AUTOMATION FUNCTION ====================

/**
 * Process a video recording that has become ready
 * Fetches transcript, extracts quote, and triggers Shotstack post-production
 */
export async function processReadyVideo(recordingId: string): Promise<ProcessResult> {
  console.log(`🎬 [AutomationService] Processing recording: ${recordingId}`);

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // ========== STEP 1: Fetch Recording Data ==========
    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single();

    if (recordingError || !recording) {
      throw new Error(`Recording not found: ${recordingId}`);
    }

    const recordingData = recording as RecordingData;

    // Validate recording is ready
    if (recordingData.video_status !== "ready") {
      throw new Error(`Recording video is not ready. Status: ${recordingData.video_status}`);
    }

    if (!recordingData.mux_playback_id) {
      throw new Error("Recording is missing Mux playback ID");
    }

    console.log(`📹 Recording found: playback_id=${recordingData.mux_playback_id}`);

    // ========== STEP 2: Fetch Session and Campaign Data ==========
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, campaign_id, company_id")
      .eq("id", recordingData.session_id)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found for recording: ${recordingId}`);
    }

    const sessionData = session as SessionData;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, name, questions")
      .eq("id", sessionData.campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${sessionData.campaign_id}`);
    }

    const campaignData = campaign as CampaignData;

    // ========== STEP 3: Fetch Brand Customization ==========
    const { data: brandCustomization } = await supabase
      .from("brand_customizations")
      .select("primary_color, secondary_color, tertiary_color, font_family")
      .eq("company_id", sessionData.company_id)
      .single();

    const theme = buildThemeConfig(brandCustomization as BrandCustomization | null);

    // ========== STEP 4: Extract Quote Text ==========
    let quoteText: string;

    if (
      recordingData.transcription &&
      recordingData.transcription_status === "completed" &&
      recordingData.transcription.split(" ").length >= 6
    ) {
      // Use first 6 words of transcript
      quoteText = extractFirstWords(recordingData.transcription, 6);
      console.log(`📝 Using transcript quote: ${quoteText}`);
    } else {
      // Fallback to question text
      quoteText = getQuestionText(campaignData, recordingData.question_index);
      console.log(`📝 Using fallback (question text): ${quoteText}`);
    }

    // ========== STEP 5: Build Video URL with Fallback ==========
    // Try high.mp4 (1080p) first, fall back to medium.mp4 (720p) if unavailable
    const playbackId = recordingData.mux_playback_id;
    const highUrl = `https://stream.mux.com/${playbackId}/high.mp4`;
    const mediumUrl = `https://stream.mux.com/${playbackId}/medium.mp4`;

    // Check if high.mp4 is available
    let videoUrl = highUrl;
    try {
      const headResponse = await fetch(highUrl, { method: 'HEAD' });
      if (!headResponse.ok) {
        console.log(`⚠️ high.mp4 unavailable (${headResponse.status}), falling back to medium.mp4`);
        videoUrl = mediumUrl;
      } else {
        console.log(`✅ Using high.mp4 (1080p)`);
      }
    } catch {
      console.log(`⚠️ Could not check high.mp4, falling back to medium.mp4`);
      videoUrl = mediumUrl;
    }
    console.log(`🎥 Video source: ${videoUrl}`);

    // ========== STEP 6: Trigger Shotstack Post-Production ==========
    const result = await produceTestimonial({
      videoUrl,
      quoteText,
      theme,
      musicUrl: BRAND_MUSIC_URL,
      duration: recordingData.duration_seconds || 30,
    });

    if (!result.success) {
      throw new Error(`Shotstack production failed: ${result.message}`);
    }

    console.log(`✅ [AutomationService] Render job submitted: ${result.response?.id}`);

    // ========== STEP 7: Update Recording with Render ID ==========
    // Note: You may want to add a 'shotstack_render_id' column to track this
    // For now, we'll just log it

    return {
      success: true,
      renderId: result.response?.id,
    };
  } catch (error) {
    console.error(`❌ [AutomationService] Error processing recording ${recordingId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if a recording is ready for post-production
 * Requirements: video_status = 'ready' AND transcription_status = 'completed'
 */
export async function isReadyForPostProduction(recordingId: string): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: recording, error } = await supabase
    .from("recordings")
    .select("video_status, transcription_status")
    .eq("id", recordingId)
    .single();

  if (error || !recording) {
    return false;
  }

  return (
    recording.video_status === "ready" &&
    recording.transcription_status === "completed"
  );
}
