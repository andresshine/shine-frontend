/**
 * Supabase Database Types
 * Auto-generated types for type-safe database queries
 */

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_customizations: {
        Row: {
          id: string;
          company_id: string;
          brandmark_light_url: string | null;
          brandmark_dark_url: string | null;
          primary_color: string;
          secondary_color: string;
          tertiary_color: string;
          button_style: "solid" | "gradient";
          corner_radius: number;
          font_family: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          brandmark_light_url?: string | null;
          brandmark_dark_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          tertiary_color?: string;
          button_style?: "solid" | "gradient";
          corner_radius?: number;
          font_family?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          brandmark_light_url?: string | null;
          brandmark_dark_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          tertiary_color?: string;
          button_style?: "solid" | "gradient";
          corner_radius?: number;
          font_family?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          questions: any; // JSONB
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          questions?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          questions?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          session_id: string;
          campaign_id: string;
          company_id: string;
          respondent_email: string | null;
          respondent_name: string | null;
          status: "pending" | "in_progress" | "completed" | "expired";
          current_question_index: number;
          started_at: string | null;
          completed_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          campaign_id: string;
          company_id: string;
          respondent_email?: string | null;
          respondent_name?: string | null;
          status?: "pending" | "in_progress" | "completed" | "expired";
          current_question_index?: number;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          campaign_id?: string;
          company_id?: string;
          respondent_email?: string | null;
          respondent_name?: string | null;
          status?: "pending" | "in_progress" | "completed" | "expired";
          current_question_index?: number;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recordings: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          question_index: number;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          duration_seconds: number | null;
          transcription: string | null;
          transcription_status: "pending" | "processing" | "completed" | "failed";
          video_status: "processing" | "ready" | "failed";
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          question_index: number;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          duration_seconds?: number | null;
          transcription?: string | null;
          transcription_status?: "pending" | "processing" | "completed" | "failed";
          video_status?: "processing" | "ready" | "failed";
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_id?: string;
          question_index?: number;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          duration_seconds?: number | null;
          transcription?: string | null;
          transcription_status?: "pending" | "processing" | "completed" | "failed";
          video_status?: "processing" | "ready" | "failed";
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string | null;
          email: string;
          full_name: string | null;
          role: "admin" | "user";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id?: string | null;
          email: string;
          full_name?: string | null;
          role?: "admin" | "user";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "user";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
