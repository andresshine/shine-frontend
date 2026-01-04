/**
 * Session API Functions
 * Functions for fetching and managing interview sessions
 */

import { supabase } from "@/lib/supabase/client";
import { InterviewSession, Question } from "@/lib/types/interview";

/**
 * Fetch a session by session_id with all related data
 */
export async function getSessionData(
  sessionId: string
): Promise<InterviewSession | null> {
  try {
    // Fetch session with campaign and company - Type cast to bypass Supabase type inference
    const { data: session, error: sessionError } = await (supabase
      .from("sessions") as any)
      .select(
        `
        *,
        campaigns (
          id,
          name,
          questions
        ),
        companies (
          id,
          name,
          logo_url
        )
      `
      )
      .eq("session_id", sessionId)
      .single();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return null;
    }

    if (!session) {
      return null;
    }

    // Fetch brand customization separately - Type cast to bypass Supabase type inference
    const { data: brandCustomization, error: brandError } = await (supabase
      .from("brand_customizations") as any)
      .select("*")
      .eq("company_id", session.company_id)
      .single();

    if (brandError) {
      console.error("Error fetching brand customization:", brandError);
      // Continue without brand customization
    }

    // Transform database response to InterviewSession type
    const interviewSession: InterviewSession = {
      session_id: session.session_id,
      company_name: session.companies.name,
      company_logo: session.companies.logo_url || undefined,
      questions: session.campaigns.questions as Question[],
      created_at: session.created_at,
      brand_customization: brandCustomization
        ? {
            primaryColor: brandCustomization.primary_color,
            secondaryColor: brandCustomization.secondary_color,
            tertiaryColor: brandCustomization.tertiary_color,
            buttonStyle: brandCustomization.button_style as
              | "solid"
              | "gradient",
            cornerRadius: brandCustomization.corner_radius,
            fontFamily: brandCustomization.font_family,
            brandmarkLight: brandCustomization.brandmark_light_url || undefined,
            brandmarkDark: brandCustomization.brandmark_dark_url || undefined,
          }
        : undefined,
    };

    return interviewSession;
  } catch (error) {
    console.error("Unexpected error fetching session:", error);
    return null;
  }
}

/**
 * Update session status and progress
 */
export async function updateSessionProgress(
  sessionId: string,
  currentQuestionIndex: number,
  status?: "pending" | "in_progress" | "completed" | "expired"
): Promise<boolean> {
  try {
    const updateData: any = {
      current_question_index: currentQuestionIndex,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;

      if (status === "in_progress" && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Type cast to bypass Supabase type inference
    const { error } = await (supabase
      .from("sessions") as any)
      .update(updateData)
      .eq("session_id", sessionId);

    if (error) {
      console.error("Error updating session:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error updating session:", error);
    return false;
  }
}

/**
 * Create a new recording entry
 */
export async function createRecording(
  sessionId: string,
  questionId: string,
  questionIndex: number,
  muxAssetId?: string
): Promise<string | null> {
  try {
    // First, get the session UUID from session_id - Type cast to bypass Supabase type inference
    const { data: session, error: sessionError } = await (supabase
      .from("sessions") as any)
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Error finding session:", sessionError);
      return null;
    }

    // Type cast to bypass Supabase type inference
    const { data, error } = await (supabase
      .from("recordings") as any)
      .insert({
        session_id: session.id,
        question_id: questionId,
        question_index: questionIndex,
        mux_asset_id: muxAssetId || null,
        video_status: "processing",
        transcription_status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating recording:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Unexpected error creating recording:", error);
    return null;
  }
}

/**
 * Get all recordings for a session
 */
export async function getSessionRecordings(sessionId: string) {
  try {
    // Get session UUID - Type cast to bypass Supabase type inference
    const { data: session, error: sessionError } = await (supabase
      .from("sessions") as any)
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Error finding session:", sessionError);
      return [];
    }

    // Type cast to bypass Supabase type inference
    const { data, error } = await (supabase
      .from("recordings") as any)
      .select("*")
      .eq("session_id", session.id)
      .order("question_index", { ascending: true });

    if (error) {
      console.error("Error fetching recordings:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching recordings:", error);
    return [];
  }
}
