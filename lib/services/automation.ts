/**
 * Shine Post-Producer Automation Service
 * Triggers video post-production when recordings become ready
 */

import { createClient } from "@supabase/supabase-js";
import { produceTestimonial, ThemeConfig, CaptionConfig } from "./shotstack";
import { jsonToSrt, DeepgramResult } from "@/lib/deepgram/utils";

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
  transcription_data: DeepgramResult | null; // Full Deepgram result with word timings
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

/**
 * Upload SRT content to Supabase Storage and return public URL
 */
async function uploadSrtToStorage(
  supabase: any, // Supabase client instance
  recordingId: string,
  srtContent: string
): Promise<string | null> {
  const fileName = `transcript-${recordingId}.srt`;
  const bucket = 'captions';

  try {
    // Upload SRT file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, srtContent, {
        contentType: 'text/plain',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`❌ Failed to upload SRT to storage:`, error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`📝 SRT uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading SRT:`, error);
    return null;
  }
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

    // ========== STEP 5: Build Video URL ==========
    // Use capped-1080p.mp4 which is generated by mp4_support: "audio-only,capped-1080p"
    const playbackId = recordingData.mux_playback_id;
    const mp4Url = `https://stream.mux.com/${playbackId}/capped-1080p.mp4`;

    // Check if capped-1080p.mp4 is available
    try {
      const headResponse = await fetch(mp4Url, { method: 'HEAD' });
      if (!headResponse.ok) {
        throw new Error(`capped-1080p.mp4 unavailable (status: ${headResponse.status}). Ensure mp4_support includes 'capped-1080p' in Mux upload settings.`);
      }
      console.log(`✅ capped-1080p.mp4 is available`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('capped-1080p.mp4 unavailable')) {
        throw error;
      }
      throw new Error(`Could not check capped-1080p.mp4 availability: ${error}`);
    }
    const videoUrl = mp4Url;
    console.log(`🎥 Video source: ${videoUrl}`);

    // ========== STEP 5.5: Generate and Upload SRT Captions ==========
    let captionsConfig: CaptionConfig | undefined;

    if (recordingData.transcription_data) {
      console.log(`📝 Generating SRT captions from transcription data...`);

      // Convert Deepgram result to SRT format
      const srtContent = jsonToSrt(recordingData.transcription_data);

      if (srtContent) {
        // Upload SRT to Supabase Storage
        const srtUrl = await uploadSrtToStorage(supabase, recordingId, srtContent);

        if (srtUrl) {
          captionsConfig = {
            srtUrl,
            fontFamily: 'Open Sans',
            fontSize: 24,
            fontColor: '#ffffff',
            backgroundColor: '#000000',
            backgroundOpacity: 0.5,
            backgroundPadding: 10,
            backgroundBorderRadius: 5,
            position: 'bottom',
            offsetY: 0.08,
          };
          console.log(`✅ Captions configured with SRT URL: ${srtUrl}`);
        }
      }
    } else {
      console.log(`⚠️ No transcription_data available, skipping captions`);
    }

    // ========== STEP 6: Trigger Shotstack Post-Production ==========
    const result = await produceTestimonial({
      videoUrl,
      quoteText,
      theme,
      musicUrl: BRAND_MUSIC_URL,
      duration: recordingData.duration_seconds || 30,
      captions: captionsConfig,
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
