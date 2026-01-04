/**
 * Interview and Question Type Definitions
 * Defines the structure for dynamic interview sessions with customizable questions
 */

export interface Question {
  id: string;
  text: string;
  intent?: string; // Optional context/guidance for the question
}

export interface BrandCustomization {
  brandmarkLight?: string; // Data URL or path to light mode logo
  brandmarkDark?: string; // Data URL or path to dark mode logo
  primaryColor: string; // Hex color for primary brand color
  secondaryColor: string; // Hex color for secondary brand color
  tertiaryColor: string; // Hex color for tertiary brand color
  buttonStyle: "solid" | "gradient"; // Button style variant
  cornerRadius: number; // Border radius in pixels (4, 8, 12, 16, or 24)
  fontFamily: string; // Font family name
}

export interface InterviewSession {
  session_id: string;
  company_name: string;
  company_logo?: string; // Optional company logo URL
  questions: Question[]; // Dynamic array of questions selected for this campaign
  created_at: string; // ISO timestamp
  brand_customization?: BrandCustomization; // Optional brand customization
}

export type EvaluationStatus = 'idle' | 'evaluating' | 'follow_up' | 'approved';

export interface InterviewState {
  session: InterviewSession;
  currentQuestionIndex: number; // Index of current question (0-based)
  isRecording: boolean; // Whether currently recording
  completedQuestions: string[]; // Array of completed question IDs
  canRedoPrevious: boolean; // Whether user can redo the previous question
  evaluationStatus: EvaluationStatus; // AI Producer evaluation status
  followUpText?: string; // Follow-up question from AI Producer
  aiScore?: number; // Score from AI evaluation (0-100)
  hasConsent: boolean; // Whether user has given recording consent
}

export interface InterviewContextType {
  state: InterviewState;
  startRecording: () => void;
  stopRecording: () => void;
  redoQuestion: () => void;
  goToNextQuestion: () => void;
  goToQuestion: (index: number) => void;
  setEvaluating: () => void; // Set state to "AI is evaluating..."
  setFollowUp: (followUpText: string, score?: number) => void; // Show follow-up question
  approveAnswer: (score?: number) => void; // Approve and move to next question
  giveConsent: () => void; // Mark that user has given recording consent
  progress: number; // Progress percentage (0-100)
  timeEstimate: {
    min: number;
    max: number;
  };
}
